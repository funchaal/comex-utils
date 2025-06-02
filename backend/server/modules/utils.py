import json
import requests
import zipfile
import io

import os
import pandas as pd

import re

import unicodedata

import tkinter as tk
from tkinter import filedialog

from datetime import datetime

from typing import List, Dict, Any

def levenshtein(s1, s2):
    len_s1 = len(s1)
    len_s2 = len(s2)

    # Cria uma matriz (len_s1+1 x len_s2+1)
    dp = [[0 for _ in range(len_s2 + 1)] for _ in range(len_s1 + 1)]

    # Inicializa a primeira linha e coluna
    for i in range(len_s1 + 1):
        dp[i][0] = i
    for j in range(len_s2 + 1):
        dp[0][j] = j

    # Preenche a matriz
    for i in range(1, len_s1 + 1):
        for j in range(1, len_s2 + 1):
            if s1[i - 1] == s2[j - 1]:
                cost = 0
            else:
                cost = 1

            dp[i][j] = min(
                dp[i - 1][j] + 1,     # Deleção
                dp[i][j - 1] + 1,     # Inserção
                dp[i - 1][j - 1] + cost  # Substituição
            )

    return dp[len_s1][len_s2]

def normalize_column_names(df):
    # Dicionário de nomes possíveis
    possible_names = {
        'ncm': ['ncm'],
        'descricao': ['descricao'],
        'denominacao': ['denominacao'],
        'raiz': ['raiz', 'cnpj'],
        'situacao': ['situacao'],
        'modalidade': ['modalidade'],
        'codigoInterno': [
            'codigo interno', 'cod interno',
            'codigo produto', 'cod produto'
        ], 
        'logradouro': [
            'logradouro', 'endereco'
        ],
        'nomeCidade': [
            'cidade', 'nome cidade', 'nome da cidade', 'municipio'
        ],
        'codigoPais': [
            'codigo pais', 'codigo do pais', 'cod do pais'
        ], 
        'pais': [
            'pais', 'nome pais', 'nome do pais', 'pais de origem', 'pais origem'
        ]
    }

    # Função auxiliar para remover acentos e substituir ç
    def normalize_text(text):
        text = text.lower()
        text = text.replace('ç', 'c')
        text = re.sub(r'[^\w\s]', '', text)
        text = unicodedata.normalize('NFKD', text)
        text = ''.join([c for c in text if not unicodedata.combining(c)])
        return text.strip()

    # Normaliza os nomes atuais das colunas
    normalized_columns = {col: normalize_text(col) for col in df.columns}

    # Novo dicionário para renomear colunas
    new_column_names = {}

    for original_col, normalized_col in normalized_columns.items():
        matched = False
        for final_name, aliases in possible_names.items():
            for alias in aliases:
                if alias in normalized_col:
                    new_column_names[original_col] = final_name
                    matched = True
                    break
            if matched: 
                del possible_names[final_name]  # Remove o nome final para evitar duplicatas
                break
                    
        # if not matched:
        #     new_column_names[original_col] = normalized_col  # mantém o nome normalizado

    # Renomeia as colunas no DataFrame
    df = df.rename(columns=new_column_names)

    return df

def get_relation_json(prod=False):
    file_path = f'attributes_relation_{'prod' if prod else 'val'}.json'

    # Verifica se o arquivo existe
    if os.path.exists(file_path):
        # Pega o timestamp de modificação
        mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
        now = datetime.now()

        # Se o dia ou a hora forem diferentes, baixa novamente
        if True or mtime.date() == now.date() or mtime.hour == now.hour:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)

    # Caso precise baixar novamente
    url = (
        'https://portalunico.siscomex.gov.br/cadatributos/api/atributo-ncm/download/json'
        if prod else
        'https://val.portalunico.siscomex.gov.br/cadatributos/api/atributo-ncm/download/json'
    )

    response = requests.get(url)

    if response.status_code == 200:
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            nome_arquivo = z.namelist()[0]  # Nome do único arquivo no ZIP

            with z.open(nome_arquivo) as json_file:
                data = json.load(json_file)

        # Salva localmente para reutilização
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return data
    else:
        response.raise_for_status()

def excel_to_dict(df):
    results = []

    df = normalize_column_names(df)

    for _, row in df.iterrows():
        
        ncm = row.get('ncm', '')

        if not ncm: continue

        ncm = str(ncm).replace('.', '').strip()
        ncm = ncm.zfill(8)

        descricao = str(row.get('descricao', '')).strip()
        denominacao = str(row.get('denominacao', '')).strip()

        raiz = str(row.get('raiz', '')).replace('.', '').strip()[:8]
        raiz = raiz.zfill(8)

        situacao = str(row.get('situacao', 'ATIVADO')).strip().upper()
        modalidade = str(row.get('modalidade', 'IMPORTACAO')).strip().upper()
        codigointerno = str(row.get('codigoInterno')).strip()

        atributos = []
        
        for col in df.columns:
            if col not in ('ncm', 'descricao', 'denominacao', 'codigoInterno', 'raiz', 'situacao', 'modalidade'):
                value = row[col]

                if '\n\n' in col:
                    col = col.split('\n\n')[0]
                match = re.match(r'^(ATT_\d+)\s*-\s*(.*)$', col)
                if match:
                    code = match.group(1).strip()
                    name = match.group(2).strip().lower()
                else:
                    code = None
                    name = col
                atributos.append({'code': str(code).strip(), 'name': str(name).strip().lower(), 'value': value})

        results.append({
            'ncm': ncm, 
            'raiz': raiz, 
            'descricao': descricao, 
            'denominacao': denominacao, 
            'codigoInterno': codigointerno, 
            'modalidade': modalidade, 
            'situacao': situacao, 
            'atributos': atributos
        })
    
    return results

def post_payload(
    url_path: str, 
    headers: Dict[str, str], 
    payload: List[Dict[str, Any]], 
    chunk_size: int = 100, 
    prod: bool = True
) -> List[Dict[str, Any]]:

    root_url = 'https://portalunico.siscomex.gov.br/' if prod else 'https://val.portalunico.siscomex.gov.br/'
    url = root_url + url_path

    all_responses = []

    for idx in range(0, len(payload), chunk_size):
        chunk = payload[idx:idx + chunk_size]
        try:
            print(f"Enviando requisição para cadastrar produtos... (chunk {idx // chunk_size + 1})")
            print('chunk', chunk)

            response = requests.post(url, headers=headers, json=chunk)
            response.raise_for_status()  # primeiro verificar status!

            response_data = response.json()
            print(response_data)

            if isinstance(response_data, list):
                all_responses.extend(response_data)
            else:
                all_responses.append(response_data)

        except requests.exceptions.RequestException as e:
            print(f"Erro ao enviar requisição: {e}")

    return all_responses

def selectFile():
    root = tk.Tk()
    root.withdraw() 

    file_path = filedialog.askopenfilename(title="Selecione um arquivo Excel", filetypes=[("Excel files", "*.xlsx;*.xls")])

    if file_path:
        # Lê todas as planilhas do arquivo
        xls = pd.ExcelFile(file_path)
        sheets = xls.sheet_names

        # Se houver mais de uma planilha, pede ao usuário para escolher
        if len(sheets) > 1:
            print(f"Planilhas disponíveis: {sheets}")
            sheet_name = input("Digite o nome da planilha que deseja abrir: ")
            while sheet_name not in sheets:
                sheet_name = input("Nome inválido! Digite um nome de planilha válido: ")
        else:
            sheet_name = sheets[0]  # Se houver apenas uma, usa ela

        # Lê a planilha escolhida
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(f"Planilha '{sheet_name}' carregada com sucesso!")

        return df
    else:
        print("Nenhum arquivo selecionado.")
        exit()